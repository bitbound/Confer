using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

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
    }
}
