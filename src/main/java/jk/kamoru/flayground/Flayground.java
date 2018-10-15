package jk.kamoru.flayground;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;

public class Flayground {
	
	public static final String ENCODING = "UTF-8";
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
			
			static {
				TB_Format.setMaximumFractionDigits(2);
				GB_Format.setMaximumFractionDigits(1);
				MB_Format.setMaximumFractionDigits(0);
				KB_Format.setMaximumFractionDigits(0);
			}
		}
	}
	
	public static class InfoFilename {
		public static final String HISTORY = "history.log";
		public static final String ACTRESS = "actress.json";
		public static final String  STUDIO =  "studio.json";
		public static final String   VIDEO =   "video.json";
		public static final String     TAG =     "tag.json";
		public static final String  ACCESS =  "access.json";
	}
	
	public static enum OS {
		WINDOWS, LINUX, MAC, UNKNOWN;

		public static final OS SYSTEM = OS.getOS();

		static OS getOS() {
			final String OSName = System.getProperty("os.name");
			return StringUtils.containsIgnoreCase(OSName, WINDOWS.name()) ? WINDOWS
					: StringUtils.containsIgnoreCase(OSName, LINUX.name()) ? LINUX
							: StringUtils.containsIgnoreCase(OSName, MAC.name()) ? MAC : UNKNOWN;
		}
	}

	public static class Suffix {
		public static class Video {
			public static final String[] SUFFIXs = new String[] {"avi", "mpg", "mkv", "wmv", "mp4", "mov", "rmvb"};
			public static boolean contains(String suffix) {
				return ArrayUtils.contains(SUFFIXs, suffix.toLowerCase());
			}
		}
		
		public static class Image {
			public static final String[] SUFFIXs = new String[] {"jpg", "jpeg", "png", "gif", "jfif", "webp"};
			public static boolean contains(String suffix) {
				return ArrayUtils.contains(SUFFIXs, suffix.toLowerCase());
			}
		}

		public static class Subtitles {
			public static final String[] SUFFIXs = new String[] {"smi", "srt", "ass", "smil"};
			public static boolean contains(String suffix) {
				return ArrayUtils.contains(SUFFIXs, suffix.toLowerCase());
			}
		}
	}

}
