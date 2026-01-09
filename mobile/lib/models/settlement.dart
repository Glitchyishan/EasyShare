import 'package:json_annotation/json_annotation.dart';

part 'settlement.g.dart';

@JsonSerializable()
class Settlement {
  final String from;
  final String to;
  final double amount;
  @JsonKey(name: 'fromName')
  final String? fromName;
  @JsonKey(name: 'toName')
  final String? toName;

  Settlement({
    required this.from,
    required this.to,
    required this.amount,
    this.fromName,
    this.toName,
  });

  factory Settlement.fromJson(Map<String, dynamic> json) =>
      _$SettlementFromJson(json);
  Map<String, dynamic> toJson() => _$SettlementToJson(this);
}
