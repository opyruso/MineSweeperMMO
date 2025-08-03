package com.minesweeper.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MineInfo(@JsonProperty("id_mine") String idMine, int x, int y, String status) {
}
