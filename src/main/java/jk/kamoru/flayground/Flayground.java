package jk.kamoru.flayground;

import java.text.SimpleDateFormat;

import org.apache.commons.lang3.StringUtils;

public class Flayground {

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
	public static final String  ACCESS_FILE_NAME = "access.json";
	
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

}
