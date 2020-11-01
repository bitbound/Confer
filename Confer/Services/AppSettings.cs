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
        ClientIceServer[] IceServers { get; }
    }

    public class AppSettings : IAppSettings
    {
        private readonly IConfiguration _config;

        private readonly ClientIceServer[] fallbackIceServers = new ClientIceServer[]
                {
            new ClientIceServer() { Urls = "stun: stun.l.google.com:19302"},
            new ClientIceServer() { Urls = "stun: stun4.l.google.com:19302"}
        };

        public AppSettings(IConfiguration config)
        {
            _config = config;
        }

        public ClientIceServer[] IceServers => _config.GetSection("IceServers").Get<ClientIceServer[]>() ?? fallbackIceServers;
    }
}
