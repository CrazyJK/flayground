package jk.kamoru.flayground;

import java.io.File;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import lombok.extern.slf4j.Slf4j;

@Configuration
@EnableAspectJAutoProxy
@EnableAsync
@EnableCaching
@EnableScheduling
@Slf4j
public class Flayground implements AsyncConfigurer {

	public static final long SERIAL_VERSION_UID = 0x02316CF8C;

	public static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36";

	public static final String ENCODING = "UTF-8";
	public static final String UTF8_BOM = "\uFEFF";
	public static final String LINE = System.getProperty("line.separator");

	public static class Format {
		public static class Date {
			public static final String PATTERN_DATE = "yyyy-MM-dd";
			public static final String PATTERN_TIME = "HH:mm:ss";

			public static final SimpleDateFormat DateTime = new SimpleDateFormat(PATTERN_DATE + " " + PATTERN_TIME);
			public static final SimpleDateFormat YYYY_MM_DD = new SimpleDateFormat("yyyy-MM-dd");
			public static final SimpleDateFormat YYYY_MM = new SimpleDateFormat("yyyy-MM");
		}

		public static class Number {
			public static final NumberFormat TB_Format = NumberFormat.getNumberInstance();
			public static final NumberFormat GB_Format = NumberFormat.getNumberInstance();
			public static final NumberFormat MB_Format = NumberFormat.getNumberInstance();
			public static final NumberFormat KB_Format = NumberFormat.getNumberInstance();
			public static final DecimalFormat Comma_Format = new DecimalFormat("###,###");

			static {
				TB_Format.setMaximumFractionDigits(2);
				GB_Format.setMaximumFractionDigits(1);
				MB_Format.setMaximumFractionDigits(0);
				KB_Format.setMaximumFractionDigits(0);
			}
		}
	}

	public static class InfoFilename {
		public static final String HISTORY = "history.csv";
		public static final String ACTRESS = "actress.json";
		public static final String STUDIO = "studio.json";
		public static final String VIDEO = "video.json";
		public static final String TAG = "tag.json";
		public static final String ACCESS = "access.json";
		public static final String NOTE = "note.json";
	}

	public static enum OS {
		WINDOWS, LINUX, MAC, UNKNOWN;

		public static OS SYSTEM = getOS();

		static OS getOS() {
			String osName = System.getProperty("os.name");
			try {
				log.info("This machine's OS is {}", osName);
				return OS.valueOf(StringUtils.split(osName)[0].toUpperCase());
			} catch (IllegalArgumentException e) {
				log.warn("This machine's OS is unknown. property 'os.name' is {}", osName);
				return UNKNOWN;
			}
		}
	}

	public static class FILE {
		public static final String[] VIDEO_SUFFIXs = new String[] {"avi", "mpg", "mkv", "wmv", "mp4", "mov", "rmvb", "m2ts"};
		public static final String[] IMAGE_SUFFIXs = new String[] {"jpg", "jpeg", "png", "gif", "jfif", "webp"};
		public static final String[] SUBTITLES_SUFFIXs = new String[] {"smi", "srt", "ass", "smil"};

		public static boolean isVideo(File file) {
			return ArrayUtils.contains(VIDEO_SUFFIXs, FilenameUtils.getExtension(file.getName()).toLowerCase());
		}

		public static boolean isImage(File file) {
			return ArrayUtils.contains(IMAGE_SUFFIXs, FilenameUtils.getExtension(file.getName()).toLowerCase());
		}

		public static boolean isSubtitles(File file) {
			return ArrayUtils.contains(SUBTITLES_SUFFIXs, FilenameUtils.getExtension(file.getName()).toLowerCase());
		}
	}

	@Override
	public Executor getAsyncExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(7);
		executor.setMaxPoolSize(42);
		executor.setQueueCapacity(11);
		executor.setThreadNamePrefix("FlayAsync-");
		executor.initialize();
		return executor;
	}

	public static BlockingQueue<Runnable> finalTasks = new LinkedBlockingQueue<>();

	public static void runFinalTasks() {
		log.info("start final {} Tasks", finalTasks.size());
		ExecutorService finalExecutor = Executors.newFixedThreadPool(finalTasks.size(), new ThreadFactory() {
			private final AtomicInteger threadNumber = new AtomicInteger(1);

			@Override
			public Thread newThread(Runnable r) {
				return new Thread(r, "FinalTask-" + threadNumber.getAndIncrement());
			}
		});
		for (Runnable task : finalTasks) {
			finalExecutor.execute(task);
		}
	}

}
