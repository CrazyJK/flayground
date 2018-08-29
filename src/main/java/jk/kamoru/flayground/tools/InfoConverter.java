package jk.kamoru.flayground.tools;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jk.kamoru.flayground.flay.domain.info.Actress;
import lombok.Data;
import lombok.NoArgsConstructor;

public class InfoConverter {

	final String[] srcPaths = new String[] {"/home/kamoru/workspace/FlayOn/real/src"};
	final String destPath = "/home/kamoru/workspace/FlayOn/real/convert";
	
	void start() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		List<Actress> actressList = new ArrayList<>();
		List<Video> videoList = new ArrayList<>();
		List<Tag> tagList = new ArrayList<>();

		for (String path : srcPaths) {
			for (File file : FileUtils.listFiles(new File(path), new String[]{"info", "actress", "data"}, true)) {
				if (FileUtils.readFileToByteArray(file).length == 0) {
					continue;
				}
				
				String suffix = StringUtils.substringAfterLast(file.getName(), ".");

				if ("actress".equals(suffix)) {
					actressList.add(mapper.readValue(file, Actress.class));
				} 
				else if ("info".equals(suffix)) {
					videoList.add(mapper.readValue(file, Video.class));
				} 
				else if ("tag.data".equals(file.getName())) {
					tagList = mapper.readValue(file, new TypeReference<List<Tag>>() {});
				} 
			}
		}
		
		ObjectWriter writer = mapper.writerWithDefaultPrettyPrinter();
		
		writer.writeValue(new File(destPath, "actress.json"), actressList);
		writer.writeValue(new File(destPath,   "video.json"),   videoList);
		writer.writeValue(new File(destPath,     "tag.json"),     tagList);
	}

	public static void main(String[] args) throws Exception {
		InfoConverter converter = new InfoConverter();
		converter.start();
	}

}

@Data
@NoArgsConstructor
class Tag {
	@JsonIgnore int id;
	String name;
	String description;
	@JsonIgnore int count;
}

@Data
@NoArgsConstructor
class Video {

	String opus;
	Integer playCount;
	Integer rank;
	String overview;
	Date lastAccess;
	List<Tag> tags = new ArrayList<>();

}
