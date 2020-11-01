using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Confer.Models
{
    public class ActiveSession
    {
        public ActiveSession(SessionDto dto)
        {
            Id = dto.Id;
            LogoUrl = dto.LogoUrl;
            PageBackgroundColor = dto.PageBackgroundColor;
            TitleBackgroundColor = dto.TitleBackgroundColor;
            TitleText = dto.TitleText;
            TitleTextColor = dto.TitleTextColor;
            PageTextColor = dto.PageTextColor;
        }

        public string Id { get; }
        public string LogoUrl { get; }
        public string PageBackgroundColor { get; }
        public string PageTextColor { get; }
        public string TitleBackgroundColor { get; }
        public ConcurrentDictionary<string, object> Participants { get; } = new ConcurrentDictionary<string, object>();
        public string TitleText { get; }
        public string TitleTextColor { get; }
    }
}
