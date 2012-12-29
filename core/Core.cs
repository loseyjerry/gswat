﻿using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.WindowsAzure.ServiceRuntime;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;
using core.ChatMessageUtilities;
using core.Server;
using core.ServerInterface;

namespace core
{
    // COMMENT!
    // Handler for mocking ChatEvents
    public delegate void ChatEventHandler(object sender, ChatEventArgs e);

    public class Core : ICore
    {
        // Implements ICore
        public ICommHandler CommHandler { get; set; }
        public CloudTable MessageTable { get; set; }
        public CloudTable CredTable { get; set; }
        public Queue<ChatMessage> MessageQueue { get; set; }

        /// <summary>
        ///     Constructs an instance of Core
        ///     Registers handlers to catch ChatMessage events
        /// </summary>
        public Core()
        {
            CommHandler = new CommHandler();
            CommHandler.CoreListener += MessageHandler;

            MessageQueue = new Queue<ChatMessage>();
            CloudStorageAccount storageAccount =
                CloudStorageAccount.Parse(RoleEnvironment.GetConfigurationSettingValue("StorageConnectionString"));
            CloudTableClient tableClient = storageAccount.CreateCloudTableClient();
            MessageTable = tableClient.GetTableReference("chatMessages");
            MessageTable.CreateIfNotExists();
        }

        // Implements ICore
        public void MessageHandler(object sender, ChatEventArgs e)
        {
            // Filter for server messages here - do not want the spam
            if (e != null && e.ServerMessage.Speaker != "Server")
            {
                MessageQueue.Enqueue(e.ServerMessage);
                if (MessageQueue.Count > 25)
                {
                    MessageQueue.Dequeue();
                }
                TableOperation insertOp = TableOperation.Insert(e.ServerMessage);
                MessageTable.Execute(insertOp);
            }
        }

        // Implements ICore
        public IEnumerable<ChatMessage> GetMessageQueue()
        {
            return MessageQueue.ToList<ChatMessage>();
        }

        // Implements ICore
        public IEnumerable<ChatMessage> GetMoreMessages(int numMessages)
        {
            var query =
                new TableQuery<ChatMessage>().Take(numMessages);
            var output = MessageTable.ExecuteQuery(query).ToList();
            output.Reverse();
            return output;
        }

        // Implements ICore
        public IEnumerable<ChatMessage> GetMessagesFromDate(DateTime date)
        {
            var query =
                new TableQuery<ChatMessage>().Where(TableQuery.GenerateFilterCondition("PartitionKey",
                                                                                       QueryComparisons.Equal,
                                                                                       date.Date.ToString("yyyyMMdd")));
            var output = MessageTable.ExecuteQuery(query).ToList();
            output.Reverse();
            return output;
        }

        // Implements ICore
        public void Connect(string address, int port, string password, string oldPass)
        {
            CloudStorageAccount storageAccount =
                CloudStorageAccount.Parse(RoleEnvironment.GetConfigurationSettingValue("StorageConnectionString"));
            CloudTableClient tableClient = storageAccount.CreateCloudTableClient();
            CredTable = tableClient.GetTableReference("serverSettings");
            CredTable.CreateIfNotExists();
            TableOperation retrieveOp = TableOperation.Retrieve<ServerSetting>(address, port + "");
            TableResult result = CredTable.Execute(retrieveOp);
            if (result.Result != null)
            {
                var settings = (ServerSetting) result.Result;
                if (oldPass == settings.Password)
                {
                    settings.Password = password;
                    TableOperation updateOp = TableOperation.Replace(settings);
                    CredTable.Execute(updateOp);
                }
            }
            else
            {
                var settings = new ServerSetting(address, port, password);
                TableOperation insertOp = TableOperation.Insert(settings);
                CredTable.Execute(insertOp);
            }

            MessageQueue.Clear();
            CommHandler.Disconnect();
            CommHandler.Connect(address, port, password);
        }
    }
}