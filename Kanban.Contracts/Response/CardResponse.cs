﻿namespace Kanban.Contracts.Response;

public class CardResponse
{
    public string ID { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public string ColumnID { get; set; }

    public string ColumnTitle { get; set; }

    public int ColumnOrder { get; set; }

    public string SwimlaneID { get; set; }

    public string SwimlaneTitle { get; set; }

    public int SwimlaneOrder { get; set; }
}