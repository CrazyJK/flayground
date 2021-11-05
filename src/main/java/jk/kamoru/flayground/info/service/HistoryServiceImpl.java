package jk.kamoru.flayground.info.service;

import java.util.List;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.FlayException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.info.domain.History;
import jk.kamoru.flayground.info.domain.History.Action;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.source.HistoryRepository;

@Service
public class HistoryServiceImpl implements HistoryService {

	@Autowired HistoryRepository historyRepository;

	ObjectWriter jsonWriter = new ObjectMapper().writerFor(Video.class);

	@Override
	public List<History> list() {
		return historyRepository.list();
	}

	@Override
	public List<History> find(String query) {
		return historyRepository.list().stream()
				.filter(h -> h.toFileSaveString().contains(query))
				.sorted((h1, h2) -> StringUtils.compare(h2.getDate(), h1.getDate()))
				.collect(Collectors.toList());
	}

	@Override
	public void persist(History history) {
		historyRepository.create(history);
	}

	@Override
	public void save(Action action, Flay flay) {
		try {
			persist(new History(action, flay.getOpus(), action == Action.UPDATE ? jsonWriter.writeValueAsString(flay.getVideo()) : flay.getFullname()));
		} catch (JsonProcessingException e) {
			throw new FlayException("fail to convert json from video", e);
		}
	}

	@Override
	public List<History> findAction(Action action) {
		return historyRepository.list().stream()
				.filter(h -> h.getAction() == action)
				.sorted((h1, h2) -> StringUtils.compare(h1.getDate(), h2.getDate()))
				.collect(Collectors.toList());
	}

}
