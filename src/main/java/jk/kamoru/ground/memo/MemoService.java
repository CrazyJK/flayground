package jk.kamoru.ground.memo;

public interface MemoService {

  Memo read();

  Memo write(String html);
}
