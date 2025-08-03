package com.minesweeper.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public record NewGameRequest(
        String title,
        int width,
        int height,
        int mineCount,
        @JsonProperty("end_date") LocalDateTime endDate) {
}

