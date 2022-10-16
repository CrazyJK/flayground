package jk.kamoru.flayground.history.service;

import java.util.List;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import jk.kamoru.flayground.FlayException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.history.domain.History;
import jk.kamoru.flayground.history.domain.History.Action;
import jk.kamoru.flayground.history.source.HistoryRepository;
import jk.kamoru.flayground.info.domain.Video;

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
        .toList();
  }

  @Override
  public List<History> findByAction(Action action) {
    return historyRepository.list().stream()
        .filter(h -> h.getAction() == action)
        .sorted((h1, h2) -> StringUtils.compare(h1.getDate(), h2.getDate()))
        .toList();
  }

  @Override
  public History findLastPlay(String opus) {
    return historyRepository.list().stream()
        .filter(h -> StringUtils.equals(h.getOpus(), opus))
        .filter(h -> h.getAction() == History.Action.PLAY)
        .sorted((h1, h2) -> StringUtils.compare(h2.getDate(), h1.getDate())).findFirst().orElse(null);
  }

  @Override
  public void persist(History history) {
    historyRepository.create(history);
  }

  @Override
  public void save(Action action, Flay flay, String deletedReason) {
    String desc;
    try {
      switch (action) {
        case PLAY:
          desc = flay.getFullname();
          break;
        case UPDATE:
          desc = jsonWriter.writeValueAsString(flay.getVideo());
          break;
        case DELETE:
          desc = deletedReason;
          break;
        default:
          throw new IllegalArgumentException("unknown action: " + action);
      }
    } catch (JsonProcessingException e) {
      throw new FlayException("fail to convert json from video", e);
    }
    persist(new History(action, flay.getOpus(), desc));
  }

}
