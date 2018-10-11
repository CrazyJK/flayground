package jk.kamoru.flayground;

import java.text.SimpleDateFormat;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jk.kamoru.flayground.flay.source.FileBasedFlaySource;
import jk.kamoru.flayground.flay.source.FlayFactory;
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
	public static final String PATTERN_DATE = "yyyy-MM-dd";
	public static final String PATTERN_TIME = "HH:mm:ss";
	public static final SimpleDateFormat DateTimeFormat = new SimpleDateFormat(PATTERN_DATE + " " + PATTERN_TIME);
	public static final SimpleDateFormat YYYY_MM_DD_Format = new SimpleDateFormat("yyyy-MM-dd");
	public static final SimpleDateFormat YYYY_MM_Format = new SimpleDateFormat("yyyy-MM");
	
	public static final String HISTORY_FILE_NAME = "history.log";
	public static final String ACTRESS_FILE_NAME = "actress.json";
	public static final String  STUDIO_FILE_NAME = "studio.json";
	public static final String   VIDEO_FILE_NAME = "video.json";
	public static final String     TAG_FILE_NAME = "tag.json";

	@Value("${path.video.archive}") String archivePath;
	@Value("${path.video.storage},${path.video.stage},${path.video.cover}") String[] instancePaths;
	@Value("${path.info}") String infoPath;
	@Value("${app.video-player}") String player;
	@Value("${app.subtitles-editor}") String editer;
	
	@Autowired AccessLogRepository accessLogRepository;
	
	public static final OS SYSTEM = OS.getOS();
	
	public static enum OS {
		WINDOWS, LINUX, MAC, UNKNOWN;

		static OS getOS() {
			final String OSName = System.getProperty("os.name");
			return StringUtils.containsIgnoreCase(OSName, WINDOWS.name()) ? WINDOWS
					: StringUtils.containsIgnoreCase(OSName, LINUX.name()) ? LINUX
							: StringUtils.containsIgnoreCase(OSName, MAC.name()) ? MAC : UNKNOWN;
		}
	}
	
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

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new AccessLogInterceptor(accessLogRepository));
	}

}
