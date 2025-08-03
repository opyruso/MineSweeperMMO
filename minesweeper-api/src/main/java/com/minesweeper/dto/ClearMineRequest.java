package com.minesweeper.dto;

public record ClearMineRequest(String gameId, int x, int y) {
}
