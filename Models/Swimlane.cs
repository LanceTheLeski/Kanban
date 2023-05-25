﻿namespace Kanban.Models
{
    public class Swimlane
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public bool IsVisible { get; set; } = true;
    }
}