using Confer.Models;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Confer.Services
{
    public class SignalingHub : Hub
    {
        public static ConcurrentDictionary<string, Session> Sessions { get; } = 
            new ConcurrentDictionary<string, Session>();

        public static ConcurrentDictionary<string, IClientProxy> Connections { get; } =
          new ConcurrentDictionary<string, IClientProxy>();

        public override Task OnConnectedAsync()
        {

            Connections.AddOrUpdate(Context.ConnectionId, Clients.Caller, (k, v) => Clients.Caller);
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            Connections.TryRemove(Context.ConnectionId, out _);
            return base.OnDisconnectedAsync(exception);
        }

        public bool ValidateSession(string sessionId)
        {
            return Sessions.ContainsKey(sessionId);
        }
    }
}
