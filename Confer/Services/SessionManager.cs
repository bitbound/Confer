using Confer.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Confer.Services
{
    public interface ISessionManager
    {
        string CreateNewSession(SessionDto session);
        bool TryGetSession(string sessionId, out ActiveSession session);
    }
    public class SessionManager : ISessionManager
    {
        private readonly ILogger<ISessionManager> _logger;
        private readonly MemoryCache _sessions = new MemoryCache(new MemoryCacheOptions());
        public SessionManager(ILogger<ISessionManager> logger)
        {
            _logger = logger;
        }

        public string CreateNewSession(SessionDto session)
        {
            var guid = Guid.NewGuid().ToString();
            session.Id = guid;
            var activeSession = new ActiveSession(session);
            _sessions.Set(guid, activeSession, CreateEntryOptions());
            return guid;
        }

        public bool TryGetSession(string sessionId, out ActiveSession session)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
            {
                session = null;
                return false;
            }
            return _sessions.TryGetValue(sessionId, out session);
        }

        private MemoryCacheEntryOptions CreateEntryOptions()
        {
            var entryOptions = new MemoryCacheEntryOptions()
            {
                SlidingExpiration = TimeSpan.FromMinutes(10)
            };
            entryOptions.RegisterPostEvictionCallback(OnEntryEvicted);
            return entryOptions;
        }

        private void OnEntryEvicted(object key, object value, EvictionReason reason, object state)
        {
            _logger.LogInformation("Evicting entry {key}.", key);

            if ((value as ActiveSession)?.Participants?.Any() == true)
            {
                _logger.LogInformation("Session still has participants.  Adding back to cache.");
                _sessions.Set(key, value, CreateEntryOptions());
            }
        }
    }
}
