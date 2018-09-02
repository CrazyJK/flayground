package jk.kamoru.flayground.info;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jk.kamoru.flayground.info.domain.Actress;
import lombok.Data;
import lombok.NoArgsConstructor;

public class InfoConverter {

//	final String[] srcPaths = new String[] {"/home/kamoru/workspace/FlayOn/crazy"};
//	final String destPath = "/home/kamoru/workspace/FlayOn/crazy/Info";

	final String[] srcPaths = new String[] {
			"J:\\Crazy\\Archive",
			"J:\\Crazy\\Cover",
			"J:\\Crazy\\Stage",
			"J:\\Crazy\\Storage",
			"K:\\Crazy\\Cover",
			"K:\\Crazy\\Stage",
			"K:\\Crazy\\Storage"
	};
	final String destPath = "J:\\Crazy\\Info";

	void start() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		List<Actress> actressList = new ArrayList<>();
		List<FromVideo> fromVideoList = new ArrayList<>();
		List<Tag> tagList = new ArrayList<>();

		for (String path : srcPaths) {
			for (File file : FileUtils.listFiles(new File(path), new String[]{"info", "actress", "data"}, true)) {
				if (FileUtils.readFileToByteArray(file).length == 0) {
					continue;
				}
				
				String suffix = StringUtils.substringAfterLast(file.getName(), ".");

				try {
					if ("actress".equals(suffix)) {
						actressList.add(loadActress(file));
					} 
					else if ("info".equals(suffix)) {
						fromVideoList.add(mapper.readValue(file, FromVideo.class));
					} 
					else if ("tag.data".equals(file.getName())) {
						tagList = mapper.readValue(file, new TypeReference<List<Tag>>() {});
					} 
				} catch(Exception e) {
					System.err.format("fail to read %s%n", file);
				}
			}
		}
		
		List<ToVideo> toVideoList = new ArrayList<>();
		for (FromVideo from : fromVideoList) {
			ToVideo to = new ToVideo();
			to.setOpus(from.opus);
			to.setPlay(from.playCount);
			to.setRank(from.rank);
			to.setComment(from.overview);
			to.setLastAccess(from.lastAccess);
			to.setTags(from.tags);
			toVideoList.add(to);
		}
		
		
		ObjectWriter writer = mapper.writerWithDefaultPrettyPrinter();
		
		writer.writeValue(new File(destPath, "actress.json"), actressList);
		writer.writeValue(new File(destPath,   "video.json"), toVideoList);
		writer.writeValue(new File(destPath,     "tag.json"),     tagList);
	}

	public static void main(String[] args) throws Exception {
		InfoConverter converter = new InfoConverter();
		converter.start();
	}

	Map<String, String> readFileToMap(File file) {
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
			throw new IllegalStateException("file read error", e);
		}
	}
	
	String trimToDefault(String str, String def) {
		String trim = StringUtils.trimToNull(str);
		return trim == null ? def : trim;
	}

	public static final String FAVORITE  = "FAVORITE";
	public static final String NAME      = "NAME";
	public static final String NEWNAME   = "NEWNAME";
	public static final String LOCALNAME = "LOCALNAME";
	public static final String BIRTH     = "BIRTH";
	public static final String BODYSIZE  = "BODYSIZE";
	public static final String HEIGHT    = "HEIGHT";
	public static final String DEBUT     = "DEBUT";
	public static final String COMMENT   = "COMMENT";

	Actress loadActress(File file) {
		Map<String, String>	info = readFileToMap(file);
		String infoName = info.get(NAME);
		if (StringUtils.isBlank(infoName) || !StringUtils.contains(file.getName(), infoName)) {
			System.err.format("actress name not equals [%s] in info file [%s]", infoName, file);
		}
		String localName = trimToDefault(info.get(LOCALNAME), "");
		String birth     = trimToDefault(info.get(BIRTH),     "");
		String height    = trimToDefault(info.get(HEIGHT),    "0");
		String body      = trimToDefault(info.get(BODYSIZE),  "");
		String debut     = trimToDefault(info.get(DEBUT),     "0");
		String comment   = trimToDefault(info.get(COMMENT),   "");
		String favorite  = trimToDefault(info.get(FAVORITE),  "false");

		Actress actress = new Actress(infoName);
		actress.setLocalName(localName);
		actress.setBirth(birth);
		actress.setHeight(new Integer(height));
		actress.setBody(body);
		actress.setDebut(new Integer(debut));
		actress.setComment(comment);
		actress.setFavorite(new Boolean(favorite));

		return actress;
	}
}

@Data
@NoArgsConstructor
class Tag {
	@JsonIgnore int id;
	String name;
	String description = "";
	@JsonIgnore int count;

	public void setDescription(String desc) {
		this.description = desc == null ? "" : desc;
	}
}

@Data
@NoArgsConstructor
class FromVideo {
	String opus;
	Integer playCount = 0;
	Integer rank = 0;
	String overview = "";
	Date lastAccess = new Date(0);
	List<Tag> tags = new ArrayList<>();

}

@Data
@NoArgsConstructor
class ToVideo {
	String opus;
	int play = 0;
	int rank = 0;
	String comment = "";
	Date lastAccess = new Date(0);
	List<Tag> tags = new ArrayList<>();
	
	public void setOpus(String opus) {
		this.opus = opus;
	}
	public void setPlay(Integer play) {
		
		this.play = play == null ? 0 : play;
	}
	public void setRank(Integer rank) {
		this.rank = rank == null ? 0 : rank;
	}
	public void setComment(String comment) {
		this.comment = comment == null ? "" : comment;
	}
	public void setLastAccess(Date lastAccess) {
		this.lastAccess = lastAccess == null ? new Date(9) : lastAccess;
	}
	public void setTags(List<Tag> tags) {
		this.tags = tags == null ? new ArrayList<Tag>() : tags;
	}
	
	
}
