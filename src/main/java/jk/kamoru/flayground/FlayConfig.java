package jk.kamoru.flayground;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jk.kamoru.flayground.flay.source.FileBasedFlaySource;
import jk.kamoru.flayground.flay.source.FlaySource;

@Configuration
public class FlayConfig {

	public static final String SUFFIX_VIDEO 	= "avi,mpg,mkv,wmv,mp4,mov,rmvb";
	public static final String SUFFIX_IMAGE 	= "jpg,jpeg,png,gif,jfif,webp";
	public static final String SUFFIX_SUBTITLES = "smi,srt,ass,smil";


	@Value("${path.video.storage},${path.video.stage},${path.video.cover}") String[] instancePaths;
	@Value("${path.info}") String infoPath;
	
	@Bean("instanceFlaySource")
	public FlaySource instanceFlaySource() {
		return new FileBasedFlaySource(instancePaths);
	}

}
