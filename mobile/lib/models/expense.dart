import 'package:json_annotation/json_annotation.dart';

part 'expense.g.dart';

@JsonSerializable()
class Expense {
  final String id;
  final String message;
  final String amount;
  @JsonKey(name: 'paid_by')
  final String paidBy;
  final List<String> participants;
  @JsonKey(name: 'created_at')
  final String createdAt;

  Expense({
    required this.id,
    required this.message,
    required this.amount,
    required this.paidBy,
    required this.participants,
    required this.createdAt,
  });

  factory Expense.fromJson(Map<String, dynamic> json) =>
      _$ExpenseFromJson(json);
  Map<String, dynamic> toJson() => _$ExpenseToJson(this);
}
