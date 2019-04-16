package jk.kamoru.flayground.flay;

import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jk.kamoru.flayground.configure.FlayProperties;
import jk.kamoru.flayground.flay.source.FileBasedFlaySource;
import jk.kamoru.flayground.flay.source.FlayFactory;
import jk.kamoru.flayground.flay.source.FlaySource;

@Configuration
public class FlayConfig {

	@Autowired FlayProperties flayProperties;

	@Bean("flayFactory")
	public FlayFactory flayFactory() {
		return new FlayFactory();
	}

	@Bean("instanceFlaySource")
	public FlaySource instanceFlaySource() {
		String[] instancePaths = ArrayUtils.addAll(flayProperties.getStagePath(), flayProperties.getCoverPath(), flayProperties.getStoragePath());
		return new FileBasedFlaySource(instancePaths );
	}

	@Bean("archiveFlaySource")
	public FlaySource archiveFlaySource() {
		return new FileBasedFlaySource(flayProperties.getArchivePath());
	}

}
