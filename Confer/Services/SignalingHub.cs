using Confer.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Confer.Services
{
    public class SignalingHub : Hub
    {
        private readonly ISessionManager _sessionManager;
        private readonly ILogger<SignalingHub> _logger;

        public static ConcurrentDictionary<string, IClientProxy> Connections { get; } =
          new ConcurrentDictionary<string, IClientProxy>();

        public SignalingHub(ISessionManager sessionManager, ILogger<SignalingHub> logger)
        {
            _sessionManager = sessionManager;
            _logger = logger;
        }


        public override Task OnConnectedAsync()
        {
            _logger.LogDebug("New connection.  Count: {count}", Connections.Count);
            Connections.AddOrUpdate(Context.ConnectionId, Clients.Caller, (k, v) => Clients.Caller);
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            _logger.LogDebug("Connection lost.  Count: {count}", Connections.Count);
            Connections.TryRemove(Context.ConnectionId, out _);
            return base.OnDisconnectedAsync(exception);
        }

        public SessionDto GetSessionInfo(string sessionId)
        {
            if (!_sessionManager.TryGetSession(sessionId, out var session))
            {
                return null;
            }

            return new SessionDto()
            {
                Id = session.Id,
                LogoUrl = session.LogoUrl,
                PageBackgroundColor = session.PageBackgroundColor,
                TitleBackgroundColor = session.TitleBackgroundColor,
                TitleText = session.TitleText,
                TitleTextColor = session.TitleTextColor
            };
        }
    }
}
