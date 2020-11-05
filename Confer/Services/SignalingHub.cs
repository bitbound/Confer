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
        private readonly IAppSettings _appSettings;

        public static ConcurrentDictionary<string, IClientProxy> Connections { get; } =
          new ConcurrentDictionary<string, IClientProxy>();

        public SignalingHub(IAppSettings appSettings,
            ISessionManager sessionManager,
            ILogger<SignalingHub> logger)
        {
            _appSettings = appSettings;
            _sessionManager = sessionManager;
            _logger = logger;
        }

        private string SessionId
        {
            get
            {
                return Context.Items["SessionId"] as string;
            }
            set
            {
                Context.Items["SessionId"] = value;
            }
        }


        public override Task OnConnectedAsync()
        {
            _logger.LogDebug("New connection.  Count: {count}", Connections.Count);
            Connections.AddOrUpdate(Context.ConnectionId, Clients.Caller, (k, v) => Clients.Caller);
            return base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            _logger.LogDebug("Connection lost.  Count: {count}", Connections.Count);
            Connections.TryRemove(Context.ConnectionId, out _);
            
            if (!string.IsNullOrWhiteSpace(SessionId))
            {
                if (_sessionManager.TryGetSession(SessionId, out var session))
                {
                    session.Participants.Remove(Context.ConnectionId, out _);
                }
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, SessionId);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public IceServer[] GetIceServers()
        {
            return _appSettings.IceServers;
        }

        public string[] GetPeers()
        {
            if (_sessionManager.TryGetSession(SessionId, out var session))
            {
                return session.Participants.Keys
                    .Where(x => x != Context.ConnectionId)
                    .ToArray();
            }
            else
            {
                return Array.Empty<string>();
            }
        }

        public SessionDto GetSessionInfo(string sessionId)
        {
            if (!_sessionManager.TryGetSession(sessionId, out var session))
            {
                return null;
            }

            return session.ToDto();
        }

        public async Task<SessionDto> JoinSession(string sessionId)
        {
            if (!_sessionManager.TryGetSession(sessionId, out var session))
            {
                return null;
            }

            SessionId = sessionId;
            session.Participants.AddOrUpdate(Context.ConnectionId, string.Empty, (k,v) => string.Empty);
            await Groups.AddToGroupAsync(Context.ConnectionId, SessionId);
            return session.ToDto();
        }

        public Task SendIceCandidate(string signalingId, string jsonCandidate)
        {
            return Clients.Client(signalingId).SendAsync("IceCandidate", Context.ConnectionId, jsonCandidate);
        }

        public Task SendChatMessage(string message, string displayName)
        {
            return Clients.Group(SessionId).SendAsync("ChatMessage", message, displayName, Context.ConnectionId);
        }

        public Task SendSdp(string signalingId, string displayName, RTCSessionDescriptionInit sessionDescription)
        {
            return Clients.Client(signalingId).SendAsync("Sdp", Context.ConnectionId, displayName, sessionDescription);
        }
    }
}
