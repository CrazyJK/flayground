package jk.kamoru.flayground.diary;

import java.util.Collection;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DiaryServiceImpl implements DiaryService {

  @Autowired DiarySource diarySource;

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
    return diarySource.save(diary);
  }

}
