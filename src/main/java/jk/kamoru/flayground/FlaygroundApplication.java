package jk.kamoru.flayground;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FlaygroundApplication {

	public static final long SERIAL_VERSION_UID = 0x02316CF8C;
	
	public static void main(String[] args) {
		SpringApplication.run(FlaygroundApplication.class, args);
	}
}
