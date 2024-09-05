package jk.kamoru.ground.diary;

import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.ground.diary.Diary.Meta;

@Service
public class DiaryServiceImpl implements DiaryService {

  @Autowired
  DiarySource diarySource;

  @Override
  public Set<String> dates() {
    return diarySource.dates();
  }

  @Override
  public Collection<Diary> list() {
    return diarySource.list();
  }

  @Override
  public Diary findByDate(String date) {
    return diarySource.find(date);
  }

  @Override
  public Diary save(Diary diary) {
    diary.getMeta().setLastModified(new Date());
    return diarySource.save(diary);
  }

  @Override
  public List<Meta> meta() {
    return diarySource.list().stream().map(Diary::getMeta).toList();
  }

}
