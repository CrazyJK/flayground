package jk.kamoru.flayground.info;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.output.FileWriterWithEncoding;
import org.apache.commons.lang3.StringUtils;

import jk.kamoru.flayground.Flayground;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class HistoryConverter {

	List<History> historyList = new ArrayList<>();

	public static void main(String[] args) throws IOException {
		HistoryConverter converter = new HistoryConverter();
		converter.process();
	}

	private void process() throws IOException {
		String infoPath = "/Users/namjk/Workspace/kamoru-ws/FlayOn/crazy/Info/history.log";
		File infoFile = new File(infoPath);
		for (String line : FileUtils.readLines(infoFile, "UTF-8")) {
			String[] split = StringUtils.split(line, ",", 4);
			String date = getDate(split[0]);
			String opus = getOpus(split[1]);
			History.Action action = getAction(split[2]);
			String desc = getDesc(split[3], action);

			History history = new History();
			history.setDate(date);
			history.setOpus(opus);
			history.setAction(action);
			history.setDesc(desc);
			historyList.add(history);
		}
		log.info("history total     count: {}", historyList.size());
		log.info("history PLAY      count: {}",	historyList.stream().filter(h -> h.getAction() == History.Action.PLAY).count());
		log.info("history OVERVIEW  count: {}",	historyList.stream().filter(h -> h.getAction() == History.Action.OVERVIEW).count());
		log.info("history SUBTITLES count: {}",	historyList.stream().filter(h -> h.getAction() == History.Action.SUBTITLES).count());
		log.info("history DELETE    count: {}",	historyList.stream().filter(h -> h.getAction() == History.Action.DELETE).count());
		log.info("history REMOVE    count: {}",	historyList.stream().filter(h -> h.getAction() == History.Action.REMOVE).count());

		File newInfoFile = new File(infoFile.getParentFile(), "history.csv");
		try (BufferedWriter writer = new BufferedWriter(new FileWriterWithEncoding(newInfoFile, Flayground.ENCODING))) {
			long writeCount = 0;
			writer.write(65279);
			for (History history : historyList) {
				if (history.getAction() == History.Action.PLAY || history.getAction() == History.Action.DELETE) {
					writer.write(history.toFileSaveString());
					writeCount++;
				}
			}
			writer.flush();
			log.info("write new history {} - {}", writeCount, newInfoFile);
		}
	}

	private String getDate(String string) {
		return StringUtils.trim(string);
	}

	private String getOpus(String string) {
		return StringUtils.trim(string).toUpperCase();
	}

	private History.Action getAction(String string) {
		string = StringUtils.trimToEmpty(string).toUpperCase();
		string = "REMOVE".equals(string) ? "DELETE" : string;
		return History.Action.valueOf(string);
	}

	private String getDesc(String string, History.Action action) {
		string = string.trim().replaceAll("\"", "");
		string = StringUtils.substringAfter(string, "[");
		string = StringUtils.substringBeforeLast(string, "]");
		return "[" + string + "]";
	}

}

@Data
class History {

	public static enum Action {
		PLAY, DELETE, OVERVIEW, SUBTITLES, REMOVE;
	}

	String date;
	String opus;
	Action action;
	String desc;

	public String toFileSaveString() {
		return MessageFormat.format("{0}, {1}, {2}, {3}{4}", date, opus, action, desc.replaceAll(",", ""),
				Flayground.LINE);
	}

}
