package com.minesweeper.dto;

import java.time.LocalDateTime;

public record ScanInfo(String id, String playerId, int x, int y, LocalDateTime scanDate, int scanRange, int mineCount) {
}

