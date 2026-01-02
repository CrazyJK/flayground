package jk.kamoru.ground.history.service;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.history.HistoryException;
import jk.kamoru.ground.history.domain.History;
import jk.kamoru.ground.history.domain.History.Action;
import jk.kamoru.ground.history.source.HistoryRepository;
import jk.kamoru.ground.info.domain.Video;

@Service
public class HistoryServiceImpl implements HistoryService {

  @Autowired
  HistoryRepository historyRepository;

  ObjectWriter jsonWriter = new ObjectMapper().writerFor(Video.class);

  @Override
  public List<History> list() {
    return historyRepository.list();
  }

  @Override
  public List<History> find(String query) {
    return historyRepository.list().stream().filter(h -> h.match(query)).sorted((h1, h2) -> StringUtils.compare(h2.getDate(), h1.getDate())).toList();
  }

  @Override
  public List<History> findByAction(Action action) {
    return historyRepository.list().stream().filter(h -> h.getAction() == action).sorted((h1, h2) -> StringUtils.compare(h2.getDate(), h1.getDate())).toList();
  }

  @Override
  public History findLastPlay(String opus) {
    return historyRepository.list().stream().filter(h -> h.getOpus().equals(opus) && h.getAction() == History.Action.PLAY).sorted((h1, h2) -> StringUtils.compare(h2.getDate(), h1.getDate())).findFirst().orElse(null);
  }

  @Override
  public void save(Action action, Flay flay, String deletedReason) {
    String desc;
    switch (action) {
    case PLAY:
      desc = flay.getFullname();
      break;
    case UPDATE:
      try {
        desc = jsonWriter.writeValueAsString(flay.getVideo());
        break;
      } catch (JsonProcessingException e) {
        throw new HistoryException("fail to convert json from video", e);
      }
    case DELETE:
      desc = deletedReason;
      break;
    default:
      throw new IllegalArgumentException("unknown action: " + action);
    }
    historyRepository.save(new History(flay.getOpus(), action, desc));
  }

}
