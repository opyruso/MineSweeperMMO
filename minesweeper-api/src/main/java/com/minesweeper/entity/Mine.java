package com.minesweeper.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "mines")
public class Mine extends PanacheEntityBase {

    @Id
    @GeneratedValue
    public UUID id;

    @ManyToOne
    @JoinColumn(name = "id_game")
    public Game game;

    public int x;

    public int y;

    @ManyToOne
    @JoinColumn(name = "foundby")
    public Player foundBy;
}
