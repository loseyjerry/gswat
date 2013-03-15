﻿using Ninject.Modules;
using core;

namespace WebFrontend.App_Start
{
    public class WebFrontendServiceModule : NinjectModule
    {
        public override void Load()
        {
            this.Bind<ICore>().To<Core>().InSingletonScope();
        }
    }
}