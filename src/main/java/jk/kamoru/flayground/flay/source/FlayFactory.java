package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.io.IOException;
import java.sql.Date;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import jk.kamoru.flayground.flay.domain.Actress;
import jk.kamoru.flayground.flay.domain.Studio;
import jk.kamoru.flayground.flay.domain.Tag;
import jk.kamoru.flayground.flay.domain.Video;
import jk.kamoru.flayground.flay.domain.info.VideoInfo;
import lombok.Data;

public class FlayFactory {

	String infoPath;
	
	public static final String SUFFIX_VIDEO 	= "avi,mpg,mkv,wmv,mp4,mov,rmvb";
	public static final String SUFFIX_IMAGE 	= "jpg,jpeg,png,gif,jfif,webp";
	public static final String SUFFIX_SUBTITLES = "smi,srt,ass,smil";
	public static final String SUFFIX_INFO      = "info";

	public FlayFactory(String infoPath) {
		this.infoPath = infoPath;
	}
	
	public Result parse(File file) {
		Result result = new Result();
		String rowData = file.getName();
		String[] parts = StringUtils.split(rowData, "]");
		if (parts == null || parts.length < 5) {
			result.valid = false;
		} else {
			result.valid = true;
			result.studio  = StringUtils.replace(parts[0], "[", "");
			result.opus    = StringUtils.replace(parts[1], "[", "");
			result.title   = StringUtils.replace(parts[2], "[", "");
			result.actress = StringUtils.replace(parts[3], "[", "");
			result.release = StringUtils.replace(parts[4], "[", "");
		}
		return result;
	}

	@Data
	class Result {
		String studio;
		String opus;
		String title;
		String actress;
		String release;
		
		boolean valid;
	}

	public Video newVideo(Result result) {
		Video video = new Video();
		video.setStudio(newStudio(result.studio));
		video.setOpus(result.opus);
		video.setTitle(result.title);
		video.setActressList(newActressList(result.actress));
		video.setRelease(result.release);
		video.setInfo(newInfo(result.opus));
		return video;
	}

	private VideoInfo newInfo(String opus) {
		List<Tag> tagList = new ArrayList<>();
		return new VideoInfo(opus, new Integer(0), new Integer(0), "", new Date(0), tagList);
	}

	private Studio newStudio(String name) {
		Studio studio = null;
		File file = new File(infoPath, name + ".studio");
		if (file.exists()) {
			ObjectMapper mapper = new ObjectMapper();
			try {
				studio = mapper.readValue(file, Studio.class);
				if (!StringUtils.contains(name, studio.getName())) {
					throw new IllegalStateException("Fail to load studio info " + file + ": name is different " + name + " != " + studio.getName());
				}
			} catch (IOException e) {
				throw new IllegalStateException("Fail to load studio info " + file, e);
			}
		} else {
			studio = new Studio(name);
		}
		return studio;
	}
	
	private List<Actress> newActressList(String actress) {
		List<Actress> list = new ArrayList<>();
		for (String name : StringUtils.split(actress, ",")) {
			String onePerson = "";
			for (String str : StringUtils.split(name)) {
				onePerson += str + " ";
			}
			list.add(newActress(onePerson.trim()));
		}
		return list;
	}

	private Actress newActress(String name) {
		Actress actress = null;
		File file = new File(infoPath, name + ".actress");
		if (file.exists()) {
			ObjectMapper mapper = new ObjectMapper();
			try {
				actress = mapper.readValue(file, Actress.class);
				if (!StringUtils.contains(name, actress.getName())) {
					throw new IllegalStateException("Fail to load actress info " + file + ": name is different " + name + " != " + actress.getName());
				}
			} catch (IOException e) {
				throw new IllegalStateException("Fail to load actress info " + file, e);
			}
		} else {
			actress = new Actress(name);
		}
		return actress;
	}

	public void addFile(Video video, File file) {
		String suffix = StringUtils.substringAfterLast(file.getName(), ".");
		if (SUFFIX_VIDEO.contains(suffix)) {
			video.addVideoFile(file);
		} else if (SUFFIX_SUBTITLES.contains(suffix)) {
			video.addSubtitlesFile(file);
		} else if (SUFFIX_IMAGE.contains(suffix)) {
			video.setCoverFile(file);
		} else if (SUFFIX_INFO.contains(suffix)) {
			video.setInfoFile(file);
			fillInfo(video, file);
		}
	}

	private void fillInfo(Video video, File file) {
		ObjectMapper mapper = new ObjectMapper();
		try {
			if (FileUtils.readFileToByteArray(file).length > 0) {
				video.setInfo(mapper.readValue(file, VideoInfo.class));
			}
		} catch (IOException e) {
			throw new IllegalStateException("Fail to load info " + file, e);
		}
	}
	
}
