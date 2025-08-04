package com.minesweeper.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "player_data")
public class PlayerData {

    @Id
    @Column(name = "id_player")
    private String idPlayer;

    @Column(name = "reputation", nullable = false)
    private int reputation;

    @Column(name = "gold", nullable = false)
    private int gold;

    @Column(name = "scan_range_max", nullable = false)
    private int scanRangeMax;

    @Column(name = "income_per_day", nullable = false)
    private int incomePerDay;

    public String getIdPlayer() {
        return idPlayer;
    }

    public void setIdPlayer(String idPlayer) {
        this.idPlayer = idPlayer;
    }

    public int getReputation() {
        return reputation;
    }

    public void setReputation(int reputation) {
        this.reputation = reputation;
    }

    public int getGold() {
        return gold;
    }

    public void setGold(int gold) {
        this.gold = gold;
    }

    public int getScanRangeMax() {
        return scanRangeMax;
    }

    public void setScanRangeMax(int scanRangeMax) {
        this.scanRangeMax = scanRangeMax;
    }

    public int getIncomePerDay() {
        return incomePerDay;
    }

    public void setIncomePerDay(int incomePerDay) {
        this.incomePerDay = incomePerDay;
    }
}

