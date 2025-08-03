package com.minesweeper.dto;

import java.time.LocalDateTime;

public record GameInfo(
        String id,
        String title,
        int width,
        int height,
        LocalDateTime startDate,
        LocalDateTime endDate,
        int mineCount,
        int foundMines
) {
}

