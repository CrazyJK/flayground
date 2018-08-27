package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;

import jk.kamoru.flayground.flay.domain.Actress;
import jk.kamoru.flayground.flay.domain.Studio;
import jk.kamoru.flayground.flay.domain.Video;
import lombok.Data;

public class FlayFactory {

	public static final String SUFFIX_VIDEO 	 = "avi,mpg,mkv,wmv,mp4,mov,rmvb";
	public static final String SUFFIX_IMAGE 	 = "jpg,jpeg,png,gif,jfif,webp";
	public static final String SUFFIX_SUBTITLES  = "smi,srt,ass,smil";
	public static final String SUFFIX_INFO       = "info";

	public static Result parse(File file) {
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
	static class Result {
		String studio;
		String opus;
		String title;
		String actress;
		String release;
		
		boolean valid;
	}

	public static Video newVideo(Result result) {
		Video video = new Video();
		video.setStudio(new Studio(result.studio));
		video.setOpus(result.opus);
		video.setTitle(result.title);
		video.setActressList(parseActress(result.actress));
		video.setRelease(result.release);
		return video;
	}

	private static List<Actress> parseActress(String actress) {
		List<Actress> list = new ArrayList<>();
		for (String name : StringUtils.split(actress, ",")) {
			String onePerson = "";
			for (String str : StringUtils.split(name)) {
				onePerson += str + " ";
			}
			list.add(new Actress(onePerson.trim()));
		}
		return list;
	}

	public static void addFile(Video video, File file) {
		String suffix = StringUtils.substringAfterLast(file.getName(), ".");
		if (SUFFIX_VIDEO.contains(suffix)) {
			video.addVideoFile(file);
		} else if (SUFFIX_SUBTITLES.contains(suffix)) {
			video.addSubtitlesFile(file);
		} else if (SUFFIX_IMAGE.contains(suffix)) {
			video.setCoverFile(file);
		} else if (SUFFIX_INFO.contains(suffix)) {
			video.setInfoFile(file);
		}
	}
	
}
