package jk.kamoru.flayground.flay;

import java.io.File;

import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.flay.source.FileBasedFlaySource;
import jk.kamoru.flayground.flay.source.FlayFactory;
import jk.kamoru.flayground.flay.source.FlaySource;

@Configuration
public class FlayConfig {

	@Autowired
	FlayProperties flayProperties;

	@Bean("flayFactory")
	public FlayFactory flayFactory() {
		return new FlayFactory();
	}

	@Bean("instanceFlaySource")
	public FlaySource instanceFlaySource() {
		File[] instancePaths = ArrayUtils.addAll(flayProperties.getStagePaths(), flayProperties.getCoverPath(), flayProperties.getStoragePath());
		return new FileBasedFlaySource(instancePaths);
	}

	@Bean("archiveFlaySource")
	public FlaySource archiveFlaySource() {
		return new FileBasedFlaySource(true, flayProperties.getArchivePath());
	}

}
