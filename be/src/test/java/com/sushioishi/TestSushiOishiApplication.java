package com.sushioishi;

import org.springframework.boot.SpringApplication;

public class TestSushiOishiApplication {

	public static void main(String[] args) {
		SpringApplication.from(SushiOishiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
