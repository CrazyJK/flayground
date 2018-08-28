package jk.kamoru.flayground.tools;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jk.kamoru.flayground.flay.domain.Actress;
import jk.kamoru.flayground.flay.domain.Studio;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class InfoConverter {

	static String  srcPath = "/home/kamoru/workspace/FlayOn/crazy/InfoConvert";
	static String destPath = "/home/kamoru/workspace/FlayOn/crazy/Info";
	
	static String[] videoPaths = new String[] {
			"/home/kamoru/workspace/FlayOn/crazy/Archive",
			"/home/kamoru/workspace/FlayOn/crazy/Storage",
			"/home/kamoru/workspace/FlayOn/crazy/Cover",
			"/home/kamoru/workspace/FlayOn/crazy/Stage"
	};
	
	void start() {
		// video info
		for (String path : videoPaths) {
			for (File file : FileUtils.listFiles(new File(path), new String[]{"info"}, true)) {
				VideoInfoConverter.convert(file);
			}
		}
		
		// etc
		Collection<File> listFiles = FileUtils.listFiles(new File(srcPath), null, false);
		for (File file : listFiles) {
			String suffix = StringUtils.substringAfterLast(file.getName(), ".");
			if ("actress".equals(suffix)) {
				ActressInfoConverter.convert(file);
			} else if ("studio".equals(suffix)) {
				StudioInfoConverter.convert(file);
			} else if ("tag.data".equals(file.getName())) {
				TagInfoConverter.convert(file);
			} else {
				System.out.format("etc file %s%n", file);
				try {
					FileUtils.copyFileToDirectory(file, new File(destPath));
				} catch (IOException e) {
					throw new RuntimeException(e);
				}
			}
		}
	}

	public static void main(String[] args) {
		new InfoConverter().start();
	}

	static Integer newInteger(String str) {
		return StringUtils.isBlank(str) ? null : new Integer(str);
	}

	static String nullValue(String str, String defaultValue) {
		return StringUtils.isBlank(str) ? defaultValue : str;  
	}
	
	static URL newURL(String str) {
		try {
			return new URL(str);
		} catch (MalformedURLException e) {
			return null;
		}
	}

	static Map<String, String> readFileToMap(File file) {
		try {
			Map<String, String> map = new HashMap<>();
			for (String str : Files.readAllLines(file.toPath())) {
				String[] strs = StringUtils.split(str, "=", 2);
				if (strs.length > 1)
					map.put(StringUtils.stripToEmpty(strs[0]), StringUtils.stripToEmpty(strs[1]));
			}
			return map;
		}
		catch (IOException e) {
			throw new RuntimeException("file read error", e);
		}
	}

	static class ActressInfoConverter {
		public static void convert(File file) {
			Map<String, String> map = readFileToMap(file);
			String favorite   = nullValue(map.get("FAVORITE"), "false");
			String name       = map.get("NAME");
			String localName  = nullValue(map.get("LOCALNAME"), "");
			String birth      = nullValue(map.get("BIRTH"), "");
			String body       = nullValue(map.get("BODYSIZE"), "");
			String height     = nullValue(map.get("HEIGHT"), "");
			String debut      = nullValue(map.get("DEBUT"), "");
			String comment    = nullValue(map.get("COMMENT"), "");
			if (StringUtils.isBlank(name)) {
				throw new IllegalStateException("actress name is blank " + file);
			}
			Actress actress = new Actress(Boolean.parseBoolean(favorite), name, localName, birth, body, newInteger(height), newInteger(debut), comment);
			ObjectMapper mapper = new ObjectMapper();
			try {
				mapper.writeValue(new File(destPath, name + ".actress"), actress);
			} catch (IOException e) {
				throw new IllegalStateException(e);
			}
		}
	}
	
	static class StudioInfoConverter {
		public static void convert(File file) {
			Map<String, String> map = readFileToMap(file);
			String name       = map.get("NAME");
			String homepage   = nullValue(map.get("HOMEPAGE"), "");
			String company    = nullValue(map.get("COMPANY"), "");
			if (StringUtils.isBlank(name)) {
				throw new IllegalStateException("studio name is blank " + file);
			}
			Studio studio = new Studio(name, newURL(homepage), company);
			ObjectMapper mapper = new ObjectMapper();
			try {
				mapper.writeValue(new File(destPath, name + ".studio"), studio);
			} catch (IOException e) {
				throw new IllegalStateException(e);
			}
		}
	}
	
	static class TagInfoConverter {
		public static void convert(File file) {
			ObjectMapper mapper = new ObjectMapper();
			File descFile = new File(destPath, "tags.data");
			try {
				List<Tag> tags = mapper.readValue(file, new TypeReference<List<Tag>>() {});
				mapper.writeValue(descFile, tags);
			} catch (IOException e) {
				throw new IllegalStateException(e);
			}
		}
	}
	
	static class VideoInfoConverter {
		public static void convert(File file) {
			ObjectMapper mapper = new ObjectMapper();
			try {
				if (FileUtils.readFileToByteArray(file).length > 0) {
					Info info = mapper.readValue(file, Info.class);
					mapper.writeValue(file, info);
				}
			} catch (IOException e) {
				throw new IllegalStateException(e);
			}
			
		}
	}
}

@Data
@AllArgsConstructor
@NoArgsConstructor
class Tag {

	int id;
	String name;
	String description;
	@JsonIgnore int count;
}

@Data
@NoArgsConstructor
class Info {

	String opus;
	Integer playCount;
	Integer rank;
	String overview;
	Date lastAccess;
	List<Tag> tags = new ArrayList<>();

}
