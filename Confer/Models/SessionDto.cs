using System.ComponentModel.DataAnnotations;

namespace Confer.Models
{
    public class SessionDto
    {
        public string Id { get; set; }

        [StringLength(30)]
        public string TitleBackgroundColor { get; set; }

        [StringLength(30)]
        public string TitleTextColor { get; set; }

        [StringLength(50)]
        public string TitleText { get; set; }

        [StringLength(500)]
        public string LogoUrl { get; set; }

        [StringLength(30)]
        public string PageBackgroundColor { get; set; }

        [StringLength(30)]
        public string PageTextColor { get; set; }
    }
}
