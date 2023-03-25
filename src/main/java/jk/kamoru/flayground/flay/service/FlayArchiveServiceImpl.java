package jk.kamoru.flayground.flay.service;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;

@Service
public class FlayArchiveServiceImpl extends FlayServiceAdapter implements FlayArchiveService {

  @Autowired
  FlaySource instanceFlaySource;
  @Autowired
  FlaySource archiveFlaySource;
  @Autowired
  FlayFileHandler flayFileHandler;

  @Override
  public Flay get(String opus) {
    try {
      return instanceFlaySource.get(opus);
    } catch (FlayNotfoundException e) {
      return archiveFlaySource.get(opus);
    }
  }

  @Override
  public Collection<Flay> list() {
    return archiveFlaySource.list();
  }

  @Override
  public Collection<Flay> find(Search search) {
    return findBySearch(archiveFlaySource.list(), search);
  }

  @Override
  public Collection<Flay> find(String query) {
    return findByQuery(archiveFlaySource.list(), query);
  }

  @Override
  public Collection<Flay> find(String field, String value) {
    return findByField(archiveFlaySource.list(), field, value);
  }

  @Override
  public void toInstance(String opus) {
    Flay flay = archiveFlaySource.get(opus);
    flayFileHandler.moveCoverDirectory(flay);
    archiveFlaySource.list().remove(flay);
  }

}
