using Confer.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Confer.Services
{
    public interface IAppSettings
    {
        IceServer[] IceServers { get; }
    }

    public class AppSettings : IAppSettings
    {
        private readonly IConfiguration _config;

        private readonly IceServer[] fallbackIceServers = new IceServer[]
                {
            new IceServer() { Urls = "stun:stun.l.google.com:19302"},
            new IceServer() { Urls = "stun:stun4.l.google.com:19302"}
        };

        public AppSettings(IConfiguration config)
        {
            _config = config;
        }

        public IceServer[] IceServers => _config.GetSection("IceServers").Get<IceServer[]>() ?? fallbackIceServers;
    }
}
