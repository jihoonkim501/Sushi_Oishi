package com.sushisoon;

import org.springframework.boot.SpringApplication;

public class TestSushiSoonApplication {

	public static void main(String[] args) {
		SpringApplication.from(SushiSoonApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
