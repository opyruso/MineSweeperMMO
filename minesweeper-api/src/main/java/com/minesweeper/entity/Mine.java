package com.minesweeper.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "mine")
public class Mine {

    @Id
    @Column(name = "id_mine")
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_game")
    private Game game;

    @Column(name = "x", nullable = false)
    private int x;

    @Column(name = "y", nullable = false)
    private int y;

    @ManyToOne
    @JoinColumn(name = "found_by")
    private Player foundBy;

    @Column(name = "exploded")
    private Boolean exploded;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Game getGame() {
        return game;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = y;
    }

    public Player getFoundBy() {
        return foundBy;
    }

    public void setFoundBy(Player foundBy) {
        this.foundBy = foundBy;
    }

    public Boolean getExploded() {
        return exploded;
    }

    public void setExploded(Boolean exploded) {
        this.exploded = exploded;
    }
}

