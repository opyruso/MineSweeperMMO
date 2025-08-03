package com.minesweeper.dto;

public record NewScanRequest(String gameId, String playerId, int x, int y, int scanRange) {
}

