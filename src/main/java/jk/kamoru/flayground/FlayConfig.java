package jk.kamoru.flayground;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jk.kamoru.flayground.flay.source.FileBasedFlaySource;
import jk.kamoru.flayground.flay.source.FlaySource;
import lombok.Getter;

@Configuration
@EnableAsync
@Getter
public class FlayConfig implements WebMvcConfigurer {

	public static final String SUFFIX_VIDEO 	= "avi,mpg,mkv,wmv,mp4,mov,rmvb";
	public static final String SUFFIX_IMAGE 	= "jpg,jpeg,png,gif,jfif,webp";
	public static final String SUFFIX_SUBTITLES = "smi,srt,ass,smil";
	public static final String ENCODING = "UTF-8";
	public static final String LINE = System.getProperty("line.separator");

	@Value("${path.video.archive}") String archivePath;
	@Value("${path.video.storage},${path.video.stage},${path.video.cover}") String[] instancePaths;
	@Value("${path.info}") String infoPath;
	@Value("${app.video-player}") String player;
	@Value("${app.subtitles-editor}") String editer;
	
	@Bean("instanceFlaySource")
	public FlaySource instanceFlaySource() {
		return new FileBasedFlaySource(instancePaths);
	}

	@Bean("archiveFlaySource")
	public FlaySource archiveFlaySource() {
		return new FileBasedFlaySource(archivePath);
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new AccessLogInterceptor());
	}

}
