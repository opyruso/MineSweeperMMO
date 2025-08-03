package com.minesweeper.dto;

public record ClearMineRequest(String gameId, String playerId, int x, int y) {
}
