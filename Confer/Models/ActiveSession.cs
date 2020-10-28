using System;
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
        }

        public string Id { get; }
        public string LogoUrl { get; }
        public string PageBackgroundColor { get; }
        public string TitleBackgroundColor { get; }
        public List<string> Participants { get; }
        public string TitleText { get; }
        public string TitleTextColor { get; }
    }
}
