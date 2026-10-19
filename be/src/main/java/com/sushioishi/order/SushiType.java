package com.sushioishi.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sushi_types")
public class SushiType {

    public static final String UNKNOWN = "unknown";

    @Id
    @Column(name = "class_id")
    private String classId;

    @Column(name = "name_ko")
    private String nameKo;

    @Column(name = "name_ja")
    private String nameJa;

    @Column(name = "group_code")
    private String groupCode;

    @Column(name = "order_score")
    private int orderScore;

    private String description;

    protected SushiType() {
    }

    public String getClassId() {
        return classId;
    }

    public String getNameKo() {
        return nameKo;
    }

    public String getNameJa() {
        return nameJa;
    }

    public String getGroupCode() {
        return groupCode;
    }

    public int getOrderScore() {
        return orderScore;
    }

    public String getDescription() {
        return description;
    }
}
