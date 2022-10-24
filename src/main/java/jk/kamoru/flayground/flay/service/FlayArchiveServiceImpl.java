package jk.kamoru.flayground.flay.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;
import org.apache.commons.lang3.RandomUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FlayArchiveServiceImpl implements FlayArchiveService {

  @Autowired FlaySource instanceFlaySource;
  @Autowired FlaySource archiveFlaySource;
  @Autowired FlayFileHandler flayFileHandler;

  Comparator<Flay> releaseReversedComparator = Comparator.comparing(Flay::getRelease).reversed();

  @Override
  public Flay get(String opus) {
    try {
      return instanceFlaySource.get(opus);
    } catch (FlayNotfoundException e) {
      return archiveFlaySource.get(opus);
    }
  }

  @Override
  public Page<Flay> page(Pageable pageable, String keyword) {
    List<Flay> foundList = new ArrayList<>();
    if ("RANDOM".equals(keyword)) {
      List<Flay> list = Stream.concat(instanceFlaySource.list().stream(), archiveFlaySource.list().stream()).toList();
      foundList.add(list.get(RandomUtils.nextInt(0, list.size())));
    } else {
      foundList = Stream.concat(instanceFlaySource.list().stream(), archiveFlaySource.list().stream())
          .filter(f -> StringUtils.containsIgnoreCase(f.toQueryString(), keyword))
          .sorted(releaseReversedComparator)
          .toList();
    }
    final long skip = pageable.getPageNumber() * pageable.getPageSize();
    final long limit = pageable.getPageSize();
    log.debug("[page] total found: {}, skip: {}, limit {}", foundList.size(), skip, limit);

    return new PageImpl<>(foundList.stream().skip(skip).limit(limit).toList(), pageable, foundList.size());
  }

  @Override
  public Collection<Flay> list() {
    return archiveFlaySource.list();
  }

  @Override
  public void toInstance(String opus) {
    Flay flay = archiveFlaySource.get(opus);
    flayFileHandler.moveCoverDirectory(flay);
    archiveFlaySource.list().remove(flay);
  }

  @Override
  public List<Flay> find(String key, String value) {
    if ("actress".equalsIgnoreCase(key)) {
      return archiveFlaySource.list().stream().filter(f -> f.getActressList().stream().anyMatch(a -> a.equals(value))).sorted(releaseReversedComparator).toList();
    } else {
      throw new IllegalStateException("unknown field");
    }
  }

  @Override
  public Collection<Flay> find(String query) {
    return archiveFlaySource.list()
        .stream()
        .filter(f -> StringUtils.containsIgnoreCase(f.toQueryString(), query))
        .sorted(releaseReversedComparator)
        .toList();
  }

}
