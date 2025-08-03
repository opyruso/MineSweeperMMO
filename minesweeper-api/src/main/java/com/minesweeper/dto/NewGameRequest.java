package com.minesweeper.dto;

public record NewGameRequest(String title, int width, int height, int mineCount) {
}

