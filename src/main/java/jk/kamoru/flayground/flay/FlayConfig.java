package jk.kamoru.flayground.flay;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jk.kamoru.flayground.flay.source.FileBasedFlaySource;
import jk.kamoru.flayground.flay.source.FlayFactory;
import jk.kamoru.flayground.flay.source.FlaySource;

@Configuration
public class FlayConfig {

	@Value("${path.video.archive}") String archivePath;
	@Value("${path.video.storage},${path.video.stage},${path.video.cover}") String[] instancePaths;

	@Bean("flayFactory")
	public FlayFactory flayFactory() {
		return new FlayFactory();
	}
	
	@Bean("instanceFlaySource")
	public FlaySource instanceFlaySource() {
		return new FileBasedFlaySource(instancePaths);
	}

	@Bean("archiveFlaySource")
	public FlaySource archiveFlaySource() {
		return new FileBasedFlaySource(archivePath);
	}

}
